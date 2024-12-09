import { TileSuit } from "../../core/tile.ts";
import { Tile } from "../components/tile.tsx";
import { TileStack } from "../components/tile-stack.tsx";
import { KongIcon, PongIcon } from "../assets.ts";
import { TileRow } from "../components/tile-row.tsx";

export default () => (
  <>
    <p>
      Two identical tiles are called a <em>pair</em>:
    </p>
    <p>
      <TileRow>
        <TileStack>
          <Tile suit={TileSuit.Circle} rank={6} />
          <Tile suit={TileSuit.Circle} rank={6} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Wind} rank={1} />
          <Tile suit={TileSuit.Wind} rank={1} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Dragon} rank={1} />
          <Tile suit={TileSuit.Dragon} rank={1} />
        </TileStack>
      </TileRow>
    </p>
    <p>
      A <em>pong</em> <PongIcon /> is a set of three identical tiles and a set
      of four identical tiles is called a <em>kong</em> <KongIcon />:
    </p>
    <p>
      <TileRow>
        <TileStack>
          <Tile suit={TileSuit.Bamboo} rank={5} />
          <Tile suit={TileSuit.Bamboo} rank={5} />
          <Tile suit={TileSuit.Bamboo} rank={5} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Wind} rank={2} />
          <Tile suit={TileSuit.Wind} rank={2} />
          <Tile suit={TileSuit.Wind} rank={2} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Myriad} rank={9} />
          <Tile suit={TileSuit.Myriad} rank={9} />
          <Tile suit={TileSuit.Myriad} rank={9} />
          <Tile suit={TileSuit.Myriad} rank={9} />
        </TileStack>
      </TileRow>
    </p>
    <p>
      A <em>sequence</em> is either a set of three consecutive, same-suited
      numerical tiles, or any three distinct, same-suited honor tiles:
    </p>
    <p>
      <TileRow>
        <TileStack>
          <Tile suit={TileSuit.Circle} rank={1} />
          <Tile suit={TileSuit.Circle} rank={2} />
          <Tile suit={TileSuit.Circle} rank={3} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Bamboo} rank={4} />
          <Tile suit={TileSuit.Bamboo} rank={5} />
          <Tile suit={TileSuit.Bamboo} rank={6} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Wind} rank={1} />
          <Tile suit={TileSuit.Wind} rank={2} />
          <Tile suit={TileSuit.Wind} rank={4} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Dragon} rank={1} />
          <Tile suit={TileSuit.Dragon} rank={2} />
          <Tile suit={TileSuit.Dragon} rank={3} />
        </TileStack>
      </TileRow>
    </p>
    <p>
      A <em>set</em> is either a pong, a kong, or a sequence.
    </p>
  </>
);
