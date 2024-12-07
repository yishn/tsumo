import { Tile } from "../components/tile.tsx";
import { TileStack } from "../components/tile-stack.tsx";
import { TileSuit } from "../../core/tile.ts";
import { WinIcon } from "../assets.ts";

export default () => (
  <>
    <p>
      The goal is to form a <em>winning hand</em> <WinIcon /> of 14 tiles. A
      standard winning hand consists of four sets and one pair.
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Circle} rank={1} />
        <Tile suit={TileSuit.Circle} rank={2} />
        <Tile suit={TileSuit.Circle} rank={3} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
        <Tile suit={TileSuit.Bamboo} rank={5} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Myriad} rank={6} />
        <Tile suit={TileSuit.Myriad} rank={7} />
        <Tile suit={TileSuit.Myriad} rank={8} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Wind} rank={1} />
        <Tile suit={TileSuit.Wind} rank={3} />
        <Tile suit={TileSuit.Wind} rank={4} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Dragon} rank={3} />
        <Tile suit={TileSuit.Dragon} rank={3} />
      </TileStack>{" "}
    </p>
    <p>
      Bonus points will be awarded if each set is a pong or kong (
      <em>All Pongs</em>). There are two special winning hands that give bonus
      points.
    </p>
    <p>
      <em>Seven Pairs</em> is achieved by forming seven pairs:
    </p>
    <p class="center">
      <TileStack>
        <Tile suit={TileSuit.Circle} rank={1} />
        <Tile suit={TileSuit.Circle} rank={1} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Circle} rank={3} />
        <Tile suit={TileSuit.Circle} rank={3} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Bamboo} rank={3} />
        <Tile suit={TileSuit.Bamboo} rank={3} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Bamboo} rank={4} />
        <Tile suit={TileSuit.Bamboo} rank={4} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Myriad} rank={5} />
        <Tile suit={TileSuit.Myriad} rank={5} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Myriad} rank={7} />
        <Tile suit={TileSuit.Myriad} rank={7} />
      </TileStack>{" "}
      <TileStack>
        <Tile suit={TileSuit.Wind} rank={2} />
        <Tile suit={TileSuit.Wind} rank={2} />
      </TileStack>{" "}
    </p>
    <p>
      <em>Chaotic Thirteen</em> is achieved by forming 14 distinct tiles, such
      that no two numerical tiles can be completed into a sequence:
    </p>
    <p class="center">
      <Tile suit={TileSuit.Circle} rank={1} />{" "}
      <Tile suit={TileSuit.Circle} rank={4} />{" "}
      <Tile suit={TileSuit.Circle} rank={7} />{" "}
      <Tile suit={TileSuit.Bamboo} rank={2} />{" "}
      <Tile suit={TileSuit.Bamboo} rank={5} />{" "}
      <Tile suit={TileSuit.Bamboo} rank={8} />{" "}
      <Tile suit={TileSuit.Myriad} rank={3} />{" "}
      <Tile suit={TileSuit.Myriad} rank={6} />{" "}
      <Tile suit={TileSuit.Myriad} rank={9} />{" "}
      <Tile suit={TileSuit.Wind} rank={1} />{" "}
      <Tile suit={TileSuit.Wind} rank={4} />{" "}
      <Tile suit={TileSuit.Dragon} rank={1} />{" "}
      <Tile suit={TileSuit.Dragon} rank={2} />{" "}
      <Tile suit={TileSuit.Dragon} rank={3} />{" "}
    </p>
    <p>
      In this case, bonus points will be awarded if all seven honor tiles are
      present (<em>Seven Stars</em>).
    </p>
  </>
);
