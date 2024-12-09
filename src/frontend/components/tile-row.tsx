import {
  Component,
  Style,
  css,
  defineComponents,
  prop,
  useEffect,
  useRef,
} from "sinho";
import { Tile } from "./tile.tsx";
import { TileStack } from "./tile-stack.tsx";

export class TileRow extends Component("tile-row", {
  minimal: prop<boolean>(false, { attribute: () => true }),
}) {
  render() {
    const slotRef = useRef<HTMLSlotElement>();

    useEffect(() => {
      if (slotRef() != null) {
        const tiles = slotRef()!
          .assignedElements()
          .flatMap((el) =>
            el instanceof Tile
              ? [el]
              : el instanceof TileStack
                ? [...el.children].filter(
                    (child): child is Tile => child instanceof Tile
                  )
                : []
          );

        tiles.forEach((tile, i) => {
          if (tile.animateEnter) {
            const oldAnimationDelay = tile.style.animationDelay;
            const delay = i * 100;

            tile.style.animationDelay = `${delay}ms`;

            setTimeout(
              () => (tile.style.animationDelay = oldAnimationDelay),
              delay + Tile.enterAnimationDuration + 50
            );
          }
        });
      }
    });

    return (
      <>
        <slot ref={slotRef} />

        <Style>{css`
          :host {
            display: flex;
            gap: ${() => (this.props.minimal() ? 0 : "0.2em")};
            flex-wrap: wrap;
            padding-bottom: 0.8em;
            align-items: center;
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileRow);
