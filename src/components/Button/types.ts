export interface CustomButtonProps {
  text: string;
  handler: () => void;
  backgroundColor?: string;
  disabled?: boolean;
  color?: string;
  fullWidth?: boolean;
}