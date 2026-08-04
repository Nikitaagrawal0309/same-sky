import { useProfile } from "../hooks/useAuth";
import { usePartner, useWorldSnapshot, useWorldState } from "../hooks/useWorld";
import { Avatar } from "../components/ui/Avatar";
import { Card, SectionHeading } from "../components/ui/Card";
import { formatDuration } from "../utils/date";
import { lowercaseFirst } from "../utils/helpers";

/**
 * Who this world belongs to.
 *
 * There is nothing to edit here — a name and a photograph come from the
 * Google account behind them, and Same Sky has no ambition to replace that.
 * This screen exists only to say, plainly, whose world this is.
 */
export default function ProfilePage() {
  const profile = useProfile();
  const partner = usePartner();
  const world = useWorldState();
  const snapshot = useWorldSnapshot();

  return (
    <div className="ss-container max-w-2xl py-12">
      <SectionHeading
        level={1}
        title="Profile"
        description="Whose world this is, and how far you've come together."
      />

      <div className="mt-10 space-y-6">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.displayName ?? "You"} photoURL={profile?.photoURL} size="lg" />

            <div className="min-w-0">
              <p className="truncate text-lg text-ink">{profile?.displayName ?? "You"}</p>
              <p className="truncate text-sm text-ink-faint">{profile?.email}</p>
            </div>
          </div>
        </Card>

        {partner ? (
          <Card padding="md">
            <div className="flex items-center gap-4">
              <Avatar name={partner.displayName} photoURL={partner.photoURL} size="lg" />

              <div className="min-w-0">
                <p className="truncate text-lg text-ink">{partner.displayName}</p>
                <p className="text-sm text-ink-faint">Your person</p>
              </div>
            </div>
          </Card>
        ) : null}

        {world && snapshot ? (
          <Card tone="sunken" padding="md">
            <p className="text-[0.95rem] leading-relaxed text-ink-soft">
              Your world was created {formatDuration(snapshot.ageInDays)} ago, and has
              held {world.totalRituals} {world.totalRituals === 1 ? "ritual" : "rituals"}{" "}
              since. Your tree has become {lowercaseFirst(snapshot.tree.stage.label)} —{" "}
              {snapshot.tree.stage.meaning}
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
