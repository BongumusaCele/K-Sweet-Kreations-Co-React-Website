import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="section">
          <h1>We couldn’t display this page</h1>
          <p>Please reload and try again.</p>
          <button
            className="button dark"
            onClick={() => window.location.reload()}
          >
            Reload website
          </button>
        </main>
      )
    return this.props.children
  }
}
