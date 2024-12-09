import { TileSuit } from "../../core/tile.ts";
import {
  DiscardIcon,
  DrawIcon,
  EatIcon,
  KongIcon,
  PongIcon,
  WinIcon,
} from "../assets.ts";
import { TileRow } from "../components/tile-row.tsx";
import { Tile } from "../components/tile.tsx";

export default () => (
  <>
    <p>
      At the start, every player gets 13 tiles and a{" "}
      <em>joker indicator tile</em> is drawn. The tiles identical to the drawn
      tile and the one that comes after in suit order will become{" "}
      <em>jokers</em> and will glow. A joker can be substituted for any tile in
      a winning hand.
    </p>
    <p>
      <TileRow>
        <Tile glow suit={TileSuit.Circle} rank={3} />
        <Tile glow suit={TileSuit.Circle} rank={4} />
        <Tile glow suit={TileSuit.Myriad} rank={9} />
        <Tile glow suit={TileSuit.Myriad} rank={1} />
        <Tile glow suit={TileSuit.Wind} rank={2} />
        <Tile glow suit={TileSuit.Wind} rank={3} />
        <Tile glow suit={TileSuit.Dragon} rank={1} />
        <Tile glow suit={TileSuit.Dragon} rank={2} />
      </TileRow>
    </p>
    <p>
      On a player’s turn, the player will first draw <DrawIcon /> a tile. They
      can then proceed to declare a win <WinIcon /> if they have a winning hand,
      or discard <DiscardIcon /> any tile on their hand.
    </p>
    <p>
      Once a tile is discarded, all the other players can react and
      <em>steal</em> the discard by forming a pong <PongIcon />, a kong
      <KongIcon />, or a winning hand <WinIcon /> with it. If someone does, the
      player who reacted reveals his completed set and the turn continues to
      them.
    </p>
    <p>
      If no one reacts, the turn continues to the next player, who then has the
      ability to either <em>eat</em> <EatIcon /> the discard by selecting two of
      their own tiles to form a sequence or other set, or to draw a new tile.
    </p>
  </>
);
