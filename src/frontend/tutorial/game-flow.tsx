import {
  DiscardIcon,
  DrawIcon,
  EatIcon,
  KongIcon,
  PongIcon,
  WinIcon,
} from "../assets.ts";

export default () => (
  <>
    <p>At the start, every player gets 13 tiles.</p>
    <p>
      On a player’s turn, they can either{" "}
      <span class="nb">
        <em>draw</em> <DrawIcon />
      </span>{" "}
      a new tile or{" "}
      <span class="nb">
        <em>eat</em> <EatIcon />
      </span>{" "}
      the previous player’s discard by selecting two of their own tiles to form
      a set and reveal them openly. They can then proceed to declare a{" "}
      <span class="nb">
        <em>win</em> <WinIcon />
      </span>{" "}
      if they have a winning hand, or{" "}
      <span class="nb">
        <em>discard</em> <DiscardIcon />
      </span>{" "}
      any tile on their hand.
    </p>
    <p>
      Once a tile is discarded, all the other players can <em>react</em> and
      steal the discard by forming a{" "}
      <span class="nb">
        pong <PongIcon />,
      </span>{" "}
      a{" "}
      <span class="nb">
        kong
        <KongIcon />,
      </span>{" "}
      or a{" "}
      <span class="nb">
        winning hand <WinIcon />
      </span>{" "}
      from their own hand with it.
    </p>
    <p>
      If someone does, the player who reacted reveals his completed set and the
      turn continues to them. If no one reacts, the turn continues to the next
      player.
    </p>
  </>
);
