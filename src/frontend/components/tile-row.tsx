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
import { animationEndOf } from "../animation.ts";

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

            tile.style.animationDelay = `${i * 0.1}s`;
            animationEndOf(tile).then(
              () => (tile.style.animationDelay = oldAnimationDelay)
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
          }
        `}</Style>
      </>
    );
  }
}

defineComponents("mj-", TileRow);
