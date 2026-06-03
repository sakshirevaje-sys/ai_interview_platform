import ExamSessionShell from "@/components/exam-session-shell";

export default async function AssessmentPage({ params }) {
  return <ExamSessionShell testId={params.testId} />;
}
