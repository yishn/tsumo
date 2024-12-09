import { TileSuit } from "../../core/tile.ts";
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
      On a player’s turn, they can either <em>eat</em> <EatIcon /> the previous
      player’s discard, or <em>draw</em> <DrawIcon /> a new tile. They can then
      proceed to declare a <em>win</em> <WinIcon /> if they have a winning hand,
      or <em>discard</em> <DiscardIcon /> any tile on their hand.
    </p>
    <p>
      Once a tile is discarded, all the other players can <em>react</em> and
      steal the discard by forming a pong <PongIcon />, a kong
      <KongIcon />, or a winning hand <WinIcon /> from their own hand with it.
      If someone does, the player who reacted reveals his completed set and the
      turn continues to them.
    </p>
    <p>
      If no one reacts, the turn continues to the next player, who then has the
      ability to either eat <EatIcon /> the discard by selecting two of their
      own tiles to form a sequence or other set, or to draw a new tile.
    </p>
  </>
);
