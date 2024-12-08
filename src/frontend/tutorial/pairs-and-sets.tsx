import { TileSuit } from "../../core/tile.ts";
import { Tile } from "../components/tile.tsx";
import { TileStack } from "../components/tile-stack.tsx";
import { KongIcon, PongIcon } from "../assets.ts";

export default () => (
  <>
    <p>
      Two identical tiles are called a <em>pair</em>:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Circle} rank={6} />
        <Tile suit={TileSuit.Circle} rank={6} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Wind} rank={1} />
        <Tile suit={TileSuit.Wind} rank={1} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={1} />
      </TileStack>
    </p>
    <p>
      A <em>pong</em> <PongIcon /> is a set of three identical tiles:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Wind} rank={2} />
        <Tile suit={TileSuit.Wind} rank={2} />
        <Tile suit={TileSuit.Wind} rank={2} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Dragon} rank={2} />
        <Tile suit={TileSuit.Dragon} rank={2} />
        <Tile suit={TileSuit.Dragon} rank={2} />
      </TileStack>
    </p>
    <p>
      A <em>kong</em> <KongIcon /> is a set of four identical tiles:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Myriad} rank={9} />
        <Tile suit={TileSuit.Myriad} rank={9} />
        <Tile suit={TileSuit.Myriad} rank={9} />
        <Tile suit={TileSuit.Myriad} rank={9} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={1} />
      </TileStack>
    </p>
    <p>
      A <em>sequence</em> is a set of three consecutive same-suited tiles:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Circle} rank={1} />
        <Tile suit={TileSuit.Circle} rank={2} />
        <Tile suit={TileSuit.Circle} rank={3} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Bamboo} rank={4} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={6} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Myriad} rank={7} />
        <Tile suit={TileSuit.Myriad} rank={8} />
        <Tile suit={TileSuit.Myriad} rank={9} />
      </TileStack>
    </p>
    <p>
      For honor tiles, any three distinct same-suited tiles can form a sequence:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Wind} rank={1} />
        <Tile suit={TileSuit.Wind} rank={2} />
        <Tile suit={TileSuit.Wind} rank={4} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={2} />
        <Tile suit={TileSuit.Dragon} rank={3} />
      </TileStack>
    </p>
    <p>
      A <em>set</em> is either a pong, a kong, or a sequence.
    </p>
  </>
);
