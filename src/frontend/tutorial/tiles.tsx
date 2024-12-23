import { TileSuit } from "../../core/tile.ts";
import { TileRow } from "../components/tile-row.tsx";
import { Tile } from "../components/tile.tsx";

export default () => (
  <>
    <p>
      There are three <em>numerical suits</em> and two non-numerical suits,
      so-called <em>honor suits</em>. The numerical tiles range from one to
      nine:
    </p>

    <table>
      <tr>
        <th>Bamboo</th>
        <td>
          <TileRow>
            <Tile suit={TileSuit.Bamboo} rank={1} />
            <Tile suit={TileSuit.Bamboo} rank={2} /> …
            <Tile suit={TileSuit.Bamboo} rank={9} />
          </TileRow>
        </td>
      </tr>
      <tr>
        <th>Circles</th>
        <td>
          <TileRow>
            <Tile suit={TileSuit.Circle} rank={1} />
            <Tile suit={TileSuit.Circle} rank={2} /> …
            <Tile suit={TileSuit.Circle} rank={9} />
          </TileRow>
        </td>
      </tr>
      <tr>
        <th>Myriads</th>
        <td>
          <TileRow>
            <Tile suit={TileSuit.Myriad} rank={1} />
            <Tile suit={TileSuit.Myriad} rank={2} /> …
            <Tile suit={TileSuit.Myriad} rank={9} />
          </TileRow>
        </td>
      </tr>
    </table>

    <p>There are two honor suits, ordered as follows:</p>

    <table>
      <tr>
        <th>Winds</th>
        <td>
          <TileRow>
            <Tile suit={TileSuit.Wind} rank={1} />
            <Tile suit={TileSuit.Wind} rank={2} />
            <Tile suit={TileSuit.Wind} rank={3} />
            <Tile suit={TileSuit.Wind} rank={4} />
          </TileRow>
        </td>
      </tr>
      <tr>
        <th>Dragons</th>
        <td>
          <TileRow>
            <Tile suit={TileSuit.Dragon} rank={1} />
            <Tile suit={TileSuit.Dragon} rank={2} />
            <Tile suit={TileSuit.Dragon} rank={3} />
          </TileRow>
        </td>
      </tr>
    </table>

    <p>There are four copies of each of the tiles.</p>
  </>
);
