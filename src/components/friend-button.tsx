import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendship,
  type RelStatus,
} from "@/app/actions/friends";

// Кнопка отношений: адаптируется под статус (нет связи / заявка / друзья).
export function FriendButton({
  profileId,
  rel,
}: {
  profileId: string;
  rel: RelStatus;
}) {
  if (rel.kind === "self") return null;

  const primary =
    "rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white";
  const ghost =
    "rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white/30";

  if (rel.kind === "none") {
    return (
      <form
        action={async () => {
          "use server";
          await sendFriendRequest(profileId);
        }}
      >
        <button className={primary}>+ Add friend</button>
      </form>
    );
  }

  if (rel.kind === "outgoing") {
    return (
      <form
        action={async () => {
          "use server";
          await removeFriendship(rel.friendshipId);
        }}
      >
        <button className={ghost}>Requested · cancel</button>
      </form>
    );
  }

  if (rel.kind === "incoming") {
    return (
      <div className="flex items-center gap-2">
        <form
          action={async () => {
            "use server";
            await acceptFriendRequest(rel.friendshipId);
          }}
        >
          <button className={primary}>Accept request</button>
        </form>
        <form
          action={async () => {
            "use server";
            await removeFriendship(rel.friendshipId);
          }}
        >
          <button className={ghost}>Decline</button>
        </form>
      </div>
    );
  }

  // friends
  return (
    <form
      action={async () => {
        "use server";
        await removeFriendship(rel.friendshipId);
      }}
    >
      <button className={ghost}>✓ Friends</button>
    </form>
  );
}
