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
    const tappers = [
      "parser",
      "beforeParse",
      "afterParse",
      "htmltag",
      "retransform",
    ] as const;

    transformHooks.beforeParse.tap((md, context) => {
      md.parse = wrapFunction(md.parse, {
        after: function (ctx) {
          const escapeAll = (token: Token, index: number, tokens: Token[]) => {
            if (
              token.type === "inline" &&
              tokens[index - 1].type === "paragraph_open"
            ) {
              if (token.content.startsWith("[ ] ")) {
                token.content = token.content.replace("[ ] ", "⬜ ");
              } else if (token.content.startsWith("[x] ")) {
                token.content = token.content.replace("[x] ", "✅ ");
              }
            }

            token.children = token.children?.map((newChild) => {
              console.log(newChild);
              if (newChild.content.startsWith("[ ] ")) {
                newChild.content = newChild.content.replace("[ ] ", "⬜ ");
              } else if (newChild.content.startsWith("[x] ")) {
                newChild.content = newChild.content.replace("[x] ", "✅ ");
              }

              return newChild;
            });
            return token;
          };

          ctx.result = ctx.result.map(escapeAll);
        },
      });
    });

    return { styles: void 0, scripts: void 0 };
  },
};
