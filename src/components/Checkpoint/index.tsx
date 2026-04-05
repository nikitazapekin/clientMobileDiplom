import Lesson from "@/components/Lesson";

const Checkpoint = ({ id }: { id: string }) => {
  return <Lesson id={id} mode="checkpoint" />;
};

export default Checkpoint;
