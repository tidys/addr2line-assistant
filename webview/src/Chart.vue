<template >
  <div>
    <button @click="onClickScrollToEnd">end</button>
    <div id="svg">

    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, watch, type PropType, onMounted, toRaw } from "vue";
import SVG from "svg.js"
export default defineComponent({
  name: "chart",
  props: {
    data: { type: Array as PropType<Array<number>>, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  setup(props, ctx) {
    let polyline: SVG.PolyLine | null = null;
    const { width, height } = props;
    let space = 10;
    let isScrollToEnd = false;
    function updatePolyline() {
      if (!polyline) return;
      // polyline?.animate(100);
      const x = polyline.x()
      const y = polyline.y()
      const mirrorPoints = transformPoints()
      polyline.plot(mirrorPoints)
      const pHeight = polyline.height();
      polyline.center(0, pHeight)
      polyline.x(x)
      polyline.y(height - pHeight)
      // scroll to end
      if (isScrollToEnd) {
        if (polyline.width() > width) {
          let x = width - polyline.width();
          polyline.x(x)
        }
      }
    }
    watch(props.data, () => {
      updatePolyline()
    })

    function transformPoints(): Array<Array<number>> {
      const raw = toRaw(props.data)
      const mirrorPoints = [];
      for (let i = 0; i < raw.length; i++) {
        const y = raw[i];
        mirrorPoints.push([i * space, height - y]);
      }
      return mirrorPoints;
    }

    onMounted(() => {
      const draw = SVG('svg').size(width, height);
      const rect = draw.rect(width, height).fill('#777')

      polyline = draw.polyline([])
        .stroke({ width: 2, color: "#00ff00" })
        .fill('none')
        .attr("height", height);
      polyline.x(0)
      polyline.y(0)
      updatePolyline()
      let x = 0, y = 0, isPressing = false;
      draw.on('mousewheel', (e: WheelEvent) => {
        let step = 0.5;
        if (e.deltaY > 0) {
          space += step
          space = Math.min(space, 20);
        } else {
          space -= step;
          space = Math.max(1, space);
        }
        updatePolyline()
      })
      draw.on('mousedown', (e: MouseEvent) => {
        x = e.screenX
        y = e.screenY
        isPressing = true;

        const mousemove = (e: MouseEvent) => {
          if (!isPressing) {
            return;
          }
          isScrollToEnd = false;
          if (!polyline) { return; }

          const diffX = e.screenX - x;
          const diffY = e.screenY - y;
          let newX = polyline.x() + diffX;
          let maxX = props.width - polyline.width();
          if (polyline.width() <= width) {
            newX = Math.max(0, newX);
            newX = Math.min(maxX, newX);

          } else {
            newX = Math.min(0, newX);
            newX = Math.max(maxX, newX);

          }
          polyline.move(newX, polyline.y());
          x = e.screenX
          y = e.screenY
        };
        const mouseup = (e: MouseEvent) => {
          isPressing = false;
          document.removeEventListener('mousemove', mousemove)
          document.removeEventListener('mouseup', mouseup);
        };
        document.addEventListener('mousemove', mousemove)
        document.addEventListener('mouseup', mouseup);
      })



    })
    return {
      onClickScrollToEnd() {
        isScrollToEnd = !isScrollToEnd;
      },

    }
  },
})
</script>