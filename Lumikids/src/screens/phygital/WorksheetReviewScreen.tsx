import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../types/navigation";
import TouchableOpacity from "../../components/common/MotionTouchable";
import { Colors } from "../../theme";
import { getSession } from "../../services/session/session";
import { hasStudentCloudSession, invalidateStudentCloudSession } from "../../services/student/studentLogin";
import { getTeacherSession } from "../../services/teacher/teacherSession";
import { getWorksheetRecord, getWorksheetHistory, requireWorksheetReviewer, revokeWorksheetReviewAccess, saveWorksheetReview, finalizeWorksheet, loadLatestWorksheetDraft,
  type WorksheetRecord, type WorksheetReview } from "../../services/phygital/worksheetStore";
import { restoreWorksheetHistory } from "../../services/sync/syncWorksheet";
import type { WorksheetAnswer } from "../../services/phygital/worksheetTypes";
import { canonicalJson } from "../../services/phygital/worksheetLayout";

export default function WorksheetReviewScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, "WorksheetReview">>();
  const [records, setRecords] = useState<WorksheetRecord[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const student = await getSession(), teacher = await getTeacherSession();
      let reviewer = "";
      if (teacher) {
        try { requireWorksheetReviewer(teacher.teacherId, params.studentId); reviewer = teacher.teacherId; }
        catch { /* A student's history remains readable without review authorization. */ }
      }
      if (!reviewer && student?.studentId !== params.studentId) throw new Error("Open this student from your class roster first.");
      if (active) { setTeacherId(reviewer); setRecords(getWorksheetHistory(params.studentId)); }
      if (!reviewer && !hasStudentCloudSession(params.studentId)) return;
      try { await restoreWorksheetHistory(params.studentId); }
      catch (error) {
        if ((error as { code?: string })?.code === "permission-denied") {
          if (reviewer) {
            revokeWorksheetReviewAccess(reviewer, params.studentId);
            throw new Error("This account no longer has access to this student's worksheets.");
          }
          await invalidateStudentCloudSession(params.studentId, error);
          if (active) setError("Showing saved worksheets. Sign in again to sync.");
          return;
        }
        if (active) setError("Showing saved local worksheets. Cloud history is unavailable.");
      }
      if (active) setRecords(getWorksheetHistory(params.studentId));
    })().catch(e => { if (active) { setTeacherId(""); setRecords([]); setError(e.message); } });
    return () => { active = false; };
  }, [params.studentId]));

  async function change(record: WorksheetRecord, index: number, answer: WorksheetAnswer | null | boolean) {
    try {
      const teacher = await getTeacherSession();
      if (!teacherId || teacher?.teacherId !== teacherId) throw new Error("Sign in as the reviewing teacher again.");
      const latest = getWorksheetRecord(params.studentId, record.worksheet.instanceId!);
      if (latest.syncConflict || latest.captureRevision !== record.captureRevision || canonicalJson(latest.capture) !== canonicalJson(record.capture)) {
        setRecords(getWorksheetHistory(params.studentId));
        throw new Error("The photo changed. Review the updated capture before confirming answers.");
      }
      record = latest;
      const review: WorksheetReview = record.review?.teacherId === teacherId
        ? { ...record.review, answers: [...record.review.answers], writing: [...record.review.writing], reviewed: [...record.review.reviewed] }
        : { teacherId, answers: record.capture?.answers.length === 5 ? [...record.capture.answers] : [],
            writing: record.worksheet.tracing ? Array(5).fill(null) : [], reviewed: Array(5).fill(false) };
      if (record.worksheet.tracing) review.writing[index] = answer as boolean;
      else review.answers[index] = answer as WorksheetAnswer | null;
      review.reviewed[index] = true;
      saveWorksheetReview(params.studentId, record.worksheet.instanceId!, review);
      setRecords(getWorksheetHistory(params.studentId));
    } catch (e) { Alert.alert("Review not saved", e instanceof Error ? e.message : "Please try again."); }
  }
  async function finish(record: WorksheetRecord) {
    try {
      const teacher = await getTeacherSession();
      if (teacher?.teacherId !== teacherId) throw new Error("Sign in as the reviewing teacher again.");
      const latest = getWorksheetRecord(params.studentId, record.worksheet.instanceId!);
      if (latest.syncConflict || latest.captureRevision !== record.captureRevision || canonicalJson(latest.capture) !== canonicalJson(record.capture)) {
        setRecords(getWorksheetHistory(params.studentId));
        throw new Error("The photo changed. Review the updated capture before finalizing.");
      }
      const result = finalizeWorksheet(params.studentId, record.worksheet.instanceId!, teacherId);
      setRecords(getWorksheetHistory(params.studentId));
      Alert.alert("Result saved", `${result.score}/5. ${result.passed ? "Completion saved." : "More practice is needed."}`);
    } catch (e) { Alert.alert("Cannot finalize", e instanceof Error ? e.message : "Please try again."); }
  }
  async function loadLatest(record: WorksheetRecord) {
    try {
      const teacher = await getTeacherSession();
      if (!teacherId || teacher?.teacherId !== teacherId) throw new Error("Sign in as the reviewing teacher again.");
      loadLatestWorksheetDraft(params.studentId, record.worksheet.instanceId!, teacherId);
      setRecords(getWorksheetHistory(params.studentId));
    } catch (e) { Alert.alert("Cannot load the latest scan", e instanceof Error ? e.message : "Please try again."); }
  }
  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.link}>← Back</Text></TouchableOpacity>
    <Text style={styles.title}>Worksheet History & Review</Text>
    {!teacherId && <Text style={styles.note}>Results are pending until your teacher signs in and opens your class roster on this device.</Text>}
    {error ? <Text style={styles.note}>{error}</Text> : null}
    {!records.length && <Text style={styles.note}>No saved worksheet copies for this student.</Text>}
    {records.filter(r => !params.instanceId || r.worksheet.instanceId === params.instanceId).map(record => {
      const w = record.worksheet;
      return <View key={w.instanceId} style={styles.card}>
        <Text style={styles.heading}>{w.title}</Text><Text style={styles.note}>Copy {w.instanceId} · Ages {w.ageRange.min}–{w.ageRange.max}</Text>
        {record.syncConflict ? <>
          <Text style={styles.note}>A newer scan or result is saved online. Review the latest copy to continue.</Text>
          {teacherId ? <TouchableOpacity style={styles.primary} onPress={() => loadLatest(record)}>
            <Text style={styles.primaryText}>Load Latest Copy</Text>
          </TouchableOpacity> : null}
        </> : record.finalized ? <Text style={styles.heading}>Finalized: {record.finalized.score}/5</Text> : !record.capture ?
          <Text style={styles.note}>Awaiting a valid photo.</Text> : <>
          {record.photoUri ? <Image source={{ uri: record.photoUri }} style={styles.photo} /> :
            <Text style={styles.note}>Photo is stored on the capture device. Check the original printed page before confirming answers here.</Text>}
          <Text style={styles.note}>Check the photo or original page. Confirm every answer, including blanks. Uncertain marks never finalize automatically. Writing requires all five activities to be completed.</Text>
          {(w.tracing?.activities ?? w.questions).map((question, i) => <View key={question.id} style={styles.row}>
            <Text style={styles.heading}>{i + 1}. {question.prompt}</Text>
            <Text style={styles.note}>{w.tracing ? `Expected: ${w.tracing.activities[i].target} · manual review` :
              `Detected: ${record.capture!.answers[i] ?? "none"} · ${record.capture!.statuses[i]} · confidence ${Math.round(record.capture!.confidence[i] * 100)}%`}</Text>
            {!w.tracing && <Text style={styles.note}>{w.questions[i].choices.map(c => `${c.id}: ${c.text}`).join(" · ")}</Text>}
            {record.review?.reviewed[i] && <Text style={styles.link}>Confirmed: {w.tracing ? (record.review.writing[i] ? "Complete" : "Incomplete") : record.review.answers[i] ?? "Blank"}</Text>}
            {teacherId ? <View style={styles.buttons}>{(w.tracing ? [true, false] : ["A", "B", "C", null]).map((answer, j) =>
              <TouchableOpacity key={j} style={styles.choice} onPress={() => change(record, i, answer as WorksheetAnswer | boolean | null)}>
                <Text style={styles.link}>{typeof answer === "boolean" ? (answer ? "Complete" : "Incomplete") : answer ?? "Blank"}</Text>
              </TouchableOpacity>)}</View> : null}
          </View>)}
          {teacherId ? <TouchableOpacity style={styles.primary} onPress={() => finish(record)}><Text style={styles.primaryText}>Finalize Reviewed Result</Text></TouchableOpacity> : null}
        </>}
      </View>;
    })}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background }, content: { padding: 20, gap: 16, maxWidth: 760, width: "100%", alignSelf: "center" },
  back: { paddingVertical: 12, alignSelf: "flex-start" }, link: { color: Colors.primary, fontWeight: "700", fontSize: 16 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "800" }, heading: { color: Colors.text, fontSize: 17, fontWeight: "700" },
  note: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, marginVertical: 6 },
  card: { backgroundColor: Colors.white, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: Colors.teacherBorder },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.teacherBorder },
  photo: { width: "100%", height: 380, resizeMode: "contain" }, buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderWidth: 1, borderColor: Colors.teacherBorder, padding: 12, borderRadius: 12, minHeight: 48 },
  primary: { backgroundColor: Colors.primary, borderRadius: 16, padding: 16, marginTop: 16, alignItems: "center", borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },
  primaryText: { color: Colors.white, fontSize: 17, fontWeight: "800" },
});
