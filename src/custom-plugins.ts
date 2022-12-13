import { wrapFunction } from "markmap-common";
import { ITransformPlugin } from "markmap-lib";

type Token = Remarkable.Remarkable.Token & {
  content?: string;
  children?: Token[];
};

export const htmlEscapePlugin: ITransformPlugin = {
  name: "htmlescape",
  config: {
    version: {
      htmlescape: "1.0",
    },
  },
  transform: (transformHooks) => {
    transformHooks.afterParse.tap((md, context) => {
      md.parse = wrapFunction(md.parse, {
        after: function (ctx) {
          const escapeAll = (token: Token) => {
            if (token.type === "htmltag" && token.content) {
              token.content = token.content
                .replace("<", "&lt;")
                .replace(">", "&gt;");
            }

            if (token.children) {
              token.children = token.children.map(escapeAll);
            }

            return token;
          };

          ctx.result = ctx.result.map(escapeAll);
        },
      });
    });

    return { styles: void 0, scripts: void 0 };
  },
};

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
        return `<span style="color: green; font-weight: bold;">✓</span>`;
      };

      md.renderer.rules.checkbox_unchkd = () => {
        return `<span style="color: red; font-weight: bold;">✗</span>`;
      };
    });

    return {
      styles: void 0,
      scripts: void 0,
    };
  },
};
