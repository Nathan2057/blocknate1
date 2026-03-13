"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            padding: 24,
            background: "rgba(255,59,92,0.05)",
            border: "1px solid rgba(255,59,92,0.2)",
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <p style={{ color: "#FF3B5C", fontWeight: 600, fontSize: "0.88rem", marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ color: "#4A5568", fontSize: "0.78rem", marginBottom: 16 }}>
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "transparent",
              border: "1px solid #1C2236",
              color: "#8892A4",
              borderRadius: 3,
              padding: "6px 16px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
