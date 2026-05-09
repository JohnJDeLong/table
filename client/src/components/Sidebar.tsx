import type { CSSProperties } from "react";
import type { SidebarAdvisor, SidebarTable, SidebarWorkspace } from "../types/sidebar";

type UrgencyRating = {
  advisorId: string;
  urgency: number;
  reason: string;
};

type SidebarProps = {
  activeWorkspace: SidebarWorkspace | null;
  activeTable: SidebarTable | null;
  sidebarAdvisors: SidebarAdvisor[];
  urgencyRatings: UrgencyRating[];
  selectActiveTable: () => void;
};


export function Sidebar({
  activeWorkspace,
  activeTable,
  sidebarAdvisors,
  urgencyRatings,
  selectActiveTable,
}: SidebarProps) {
  return (
    <aside className="sidebar">
        <div>
        <div className="sidebar-brand">Table</div>

        <section className="sidebar-section">
          <div className="sidebar-section-header">
            <span>Workspaces</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Add workspace"
            >
              +
            </button>
          </div>

          <details className="workspace-group" open>
            <summary
              className={`workspace-button ${
                activeWorkspace ? "workspace-button--active" : ""
              }`}
            >
              {activeWorkspace?.name ?? "Loading workspace"}
            </summary>

            <div className="room-list">
              <div className="sidebar-section-header sidebar-section-header--nested">
                <span>Tables</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Add table"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className={`room-item ${activeTable ? "room-item--active" : ""}`}
                onClick={selectActiveTable}
              >
                {activeTable?.name ?? "Loading table"}
              </button>


              <div className="advisor-list">
                <div className="sidebar-section-header sidebar-section-header--nested">
                  <span>Advisors</span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Add advisor"
                  >
                    +
                  </button>
                </div>

                {sidebarAdvisors.map((advisor) => {
                  const rating = urgencyRatings.find(
                    (item) => item.advisorId === advisor.speakerId
                  );
                  const urgencyOpacity = rating
                    ? Math.max(0.12, rating.urgency / 10)
                    : 0.12;
                  const tooltipText = rating
                    ? `${rating.urgency}/10 - ${rating.reason}`
                    : advisor.enabled
                      ? "No rating yet"
                      : "Disabled";

                  return (
                    <div
                      className={`advisor-row ${
                        advisor.enabled
                          ? "advisor-row--online"
                          : "advisor-row--disabled"
                      }`}
                      key={advisor.id}
                    >
                      <div className="advisor-meta">
                        <span className="advisor-name">{advisor.name}</span>
                      </div>
                      <span
                        aria-label={`${advisor.name}: ${tooltipText}`}
                        className="advisor-urgency-dot"
                        data-tooltip={tooltipText}
                        style={
                          advisor.enabled
                            ? ({ "--urgency-opacity": urgencyOpacity } as CSSProperties)
                            : undefined
                        }
                        tabIndex={0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        </section>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="footer-button">
          Settings
        </button>
        <button type="button" className="footer-button">
          Profile
        </button>
      </div>
    </aside>
  );
}
