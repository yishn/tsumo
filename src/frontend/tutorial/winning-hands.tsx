import { Tile } from "../components/tile.tsx";
import { TileStack } from "../components/tile-stack.tsx";
import { TileSuit } from "../../core/tile.ts";
import { WinIcon } from "../assets.ts";
import { TileRow } from "../components/tile-row.tsx";

export default () => (
  <>
    <p>
      The goal is to form a <em>winning hand</em> <WinIcon /> of 14 tiles. A
      standard winning hand consists of four sets and one pair.
    </p>
    <p>
      <TileRow>
        <TileStack>
          <Tile suit={TileSuit.Circle} rank={1} />
          <Tile suit={TileSuit.Circle} rank={2} />
          <Tile suit={TileSuit.Circle} rank={3} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Bamboo} rank={5} />
          <Tile suit={TileSuit.Bamboo} rank={5} />
          <Tile suit={TileSuit.Bamboo} rank={5} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Myriad} rank={6} />
          <Tile suit={TileSuit.Myriad} rank={7} />
          <Tile suit={TileSuit.Myriad} rank={8} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Wind} rank={1} />
          <Tile suit={TileSuit.Wind} rank={3} />
          <Tile suit={TileSuit.Wind} rank={4} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Dragon} rank={3} />
          <Tile suit={TileSuit.Dragon} rank={3} />
        </TileStack>
      </TileRow>
    </p>
    <p>
      There are two special winning hands. <em>Seven Pairs</em> is achieved by
      forming seven pairs:
    </p>
    <p>
      <TileRow>
        <TileStack>
          <Tile suit={TileSuit.Circle} rank={1} />
          <Tile suit={TileSuit.Circle} rank={1} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Circle} rank={3} />
          <Tile suit={TileSuit.Circle} rank={3} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Bamboo} rank={3} />
          <Tile suit={TileSuit.Bamboo} rank={3} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Bamboo} rank={4} />
          <Tile suit={TileSuit.Bamboo} rank={4} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Myriad} rank={5} />
          <Tile suit={TileSuit.Myriad} rank={5} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Myriad} rank={7} />
          <Tile suit={TileSuit.Myriad} rank={7} />
        </TileStack>
        <TileStack>
          <Tile suit={TileSuit.Wind} rank={2} />
          <Tile suit={TileSuit.Wind} rank={2} />
        </TileStack>
      </TileRow>
    </p>
    <p>
      <em>Chaotic Thirteen</em> is achieved by forming 14 distinct tiles, such
      that no two numerical tiles can be completed into a sequence:
    </p>
    <p>
      <TileRow>
        <Tile suit={TileSuit.Circle} rank={1} />
        <Tile suit={TileSuit.Circle} rank={4} />
        <Tile suit={TileSuit.Circle} rank={7} />
        <Tile suit={TileSuit.Bamboo} rank={2} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={8} />
        <Tile suit={TileSuit.Myriad} rank={3} />
        <Tile suit={TileSuit.Myriad} rank={6} />
        <Tile suit={TileSuit.Myriad} rank={9} />
        <Tile suit={TileSuit.Wind} rank={1} />
        <Tile suit={TileSuit.Wind} rank={4} />
        <Tile suit={TileSuit.Dragon} rank={1} />
        <Tile suit={TileSuit.Dragon} rank={2} />
        <Tile suit={TileSuit.Dragon} rank={3} />
      </TileRow>
    </p>
  </>
);
