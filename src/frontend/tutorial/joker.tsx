import { TileSuit } from "../../core/tile.ts";
import { Tile } from "../components/tile.tsx";
import { TileRow } from "../components/tile-row.tsx";

export default () => (
  <>
    <p>
      At the start, a <em>joker indicator tile</em> is drawn. The tiles
      identical to the drawn tile will become the <em>primary joker</em> and the
      next tile in suit order will become the <em>secondary joker</em>. Both of
      them will glow and can be substituted for any tile in a winning hand.
    </p>
    <table>
      <tr>
        <th>Primary</th>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Circle} rank={1} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Myriad} rank={5} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Wind} rank={2} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Dragon} rank={1} />
          </TileRow>
        </td>
      </tr>
      <tr>
        <th>Secondary</th>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Circle} rank={2} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Myriad} rank={6} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Wind} rank={3} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Dragon} rank={2} />
          </TileRow>
        </td>
      </tr>
    </table>
    <p>
      If the primary joker is the last tile of the suit, the secondary joker
      will be the first tile of the same suit.
    </p>
    <table>
      <tr>
        <th>Primary</th>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Bamboo} rank={9} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Myriad} rank={9} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Wind} rank={4} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Dragon} rank={3} />
          </TileRow>
        </td>
      </tr>
      <tr>
        <th>Secondary</th>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Bamboo} rank={1} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Myriad} rank={1} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Wind} rank={1} />
          </TileRow>
        </td>
        <td>
          <TileRow>
            <Tile glow suit={TileSuit.Dragon} rank={1} />
          </TileRow>
        </td>
      </tr>
    </table>
  </>
);
