import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; onReset?: () => void; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The boundary deliberately avoids rendering exception details or configuration in the UI.
  }

  private reset = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) this.props.onReset();
    else window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="fatal-error"><WarningCircle aria-hidden="true" /><h1>This page could not be displayed</h1><p>IncidentScope stopped this view before it could show incomplete or misleading state. Reload the app and read canonical data again.</p><button className="button primary" type="button" onClick={this.reset}><ArrowClockwise aria-hidden="true" /> Reload IncidentScope</button></main>;
  }
}
