import { StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import MindmapView from "./mindmap-view";

export const updater = (mmView: MindmapView) =>
  StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(value, tr) {
      const fullValue = tr.newDoc.sliceString(0);

      if (tr.docChanged) {
        mmView.update(fullValue).then(() => ({}));
      }

      return value.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
