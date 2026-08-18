import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrutButton } from "../ui/brut";

interface Props {
  children: ReactNode;
  label?: string;
  onReset?: () => void;
}

export class GameErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="brut flex h-full flex-col items-center justify-center gap-3 bg-lab-yellow p-6 text-center">
        <h3 className="font-display text-2xl">{this.props.label ?? "GAME"}.EXE ENCOUNTERED AN ERROR</h3>
        <p className="mono-label">Don't worry. The lab is probably fine.</p>
        <BrutButton
          variant="danger"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset?.();
          }}
        >
          RESTART GAME
        </BrutButton>
      </div>
    );
  }
}
