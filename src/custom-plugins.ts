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
    transformHooks.beforeParse.tap((md, context) => {
      md.parse = wrapFunction(md.parse, {
        after: function (ctx) {
          const replaceSingle = (token: Token) => {
            const active = [
              ["[ ] ", "⬜ "],
              ["[x] ", "✅ "],
              ["[X] ", "✅ "],

              ["- [ ] ", "⬜ "],
              ["- [x] ", "✅ "],
              ["- [X] ", "✅ "],
            ].find(([a, b]) => token.content?.startsWith(a));

            if (active) {
              token.content = token.content?.replace(active[0], active[1]);
            }

            return token;
          };

          const replaceSymbols = (token: Token) => {
            if (token.children)
              token.children = token.children.map(replaceSingle);

            return token;
          };

          ctx.result = ctx.result.map(replaceSymbols);
        },
      });
    });

    return { styles: void 0, scripts: void 0 };
  },
};
