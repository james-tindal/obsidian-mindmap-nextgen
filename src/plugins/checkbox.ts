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
      md.use((md, options) => {
        md.inline.ruler.push(
          "checkbox",
          (state, silent) => {
            const mdCheckRegex = /^ *-? *\[[ xX]\] +/;

            if (!mdCheckRegex.test(state.src)) {
              return false;
            }

            const mdCheckedRegex = /^ *-? *\[[xX]\] +/;
            const mdUncheckedRegex = /^ *-? *\[ \] +/;

            if (mdCheckedRegex.test(state.src)) {
              state.src = state.src.replace(mdCheckedRegex, "");
              state.push({
                type: "checkbox_chkd",
                content: "checkbox_chkd",
                level: state.level + 1,
              });
            } else if (mdUncheckedRegex.test(state.src)) {
              state.src = state.src.replace(mdUncheckedRegex, "");
              state.push({
                type: "checkbox_unchkd",
                content: "checkbox_unchkd",
                level: state.level + 1,
              });
            }

            return true;
          },
          {}
        );
      });

      md.renderer.rules.checkbox_chkd = () => {
        return `<span style="color: green; font-weight: bold;">✓&nbsp;</span>`;
      };

      md.renderer.rules.checkbox_unchkd = () => {
        return `<span style="color: red; font-weight: bold;">✗&nbsp;</span>`;
      };
    });

    return {
      styles: void 0,
      scripts: void 0,
    };
  },
};
