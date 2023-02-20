import { ITransformPlugin } from "markmap-lib";

export const checkBoxPlugin: ITransformPlugin = {
  name: "checkbox",
  config: {
    version: {
      checkbox: "1.0",
    },
  },
  transform: (transformHooks) => {
    transformHooks.parser.tap((md) => {
      md.use((md) => {
        md.inline.ruler.push("checkbox", (state) => {
          if (state.pos !== 0) return false;

          const match = /^ *-? *\[(?<state>[ xX])\] +/.exec(state.src);
          const checked = match?.groups?.state !== " ";
          const length = match?.[0].length!;
          const token = `checkbox_${checked ? "" : "un"}chkd`;

          if (!match) return false

          state.push({
            type: token,
            level: state.level,
            block: false
          });

          state.pos += length;
          return true;
        }, {});
      });

      md.renderer.rules.checkbox_chkd   = () => `<span class="mm-ng-checkbox-checked">✓&nbsp;</span>`;
      md.renderer.rules.checkbox_unchkd = () => `<span class="mm-ng-checkbox-unchecked">✗&nbsp;</span>`;
    });

    return {
      styles: void 0,
      scripts: void 0,
    };
  },
};
