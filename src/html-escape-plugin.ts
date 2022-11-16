import { IWrapContext } from "markmap-common";
import { ITransformPlugin } from "markmap-lib";

type Token = Remarkable.Remarkable.Token & {
  content?: string;
  children?: Token[];
};

function wrapFunction<T extends unknown[], U>(
  fn: (...args: T) => U,
  {
    before,
    after,
  }: {
    before?: (ctx: IWrapContext<T, U>) => void;
    after?: (ctx: IWrapContext<T, U>) => void;
  }
) {
  return function wrapped(...args: T) {
    const ctx: IWrapContext<T, U> = {
      args,
      thisObj: this,
    };
    try {
      if (before) before(ctx);
    } catch {
      // ignore
    }
    ctx.result = fn.apply(ctx.thisObj, ctx.args);
    try {
      if (after) after(ctx);
    } catch {
      // ignore
    }
    return ctx.result;
  };
}

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
