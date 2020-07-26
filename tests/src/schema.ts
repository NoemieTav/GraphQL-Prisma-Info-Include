import * as fs from "fs";
import {infoToInclude} from "../../src/main";

export const resolvers = {
  PostError: {__resolveType: (a) => {
    if (a.__typename) return a.__typename;
      if (a.message) return "Error"
      if (a.id) return "Post"
    }},
  Query: {
    feed: (_parent, _args, ctx) => {
      return ctx.prisma.post.findMany({
        where: {published: true},
      });
    }, filterPosts: (_, {searchString}, ctx) => {
      return ctx.prisma.post.findMany({
        where: {
          OR: [
            {title: {contains: searchString}},
            {content: {contains: searchString}},
          ],
        },
      });
    },
  },
  Mutation: {
    signupUser: (_parent, args, ctx, info) => {
      if (args.name) fs.writeFileSync(`${args.name}.json`, JSON.stringify(info));
      return ctx.prisma.user.create({
        data: args.data,
        include: infoToInclude({type: "root", isSelect: false, rootInclude: false}, info),
      });
    },
    createDraft: async (_, {title, content, authorEmail, name}, ctx, info) => {
      if (name) fs.writeFileSync(`${name}.json`, JSON.stringify(info));
      if (!(await ctx.prisma.user.findOne({where: {email: authorEmail}}))) return {error: [{message: "user not found"}]}
      return {data: await ctx.prisma.post.create({
        data: {
          title,
          content,
          published: false,
          author: {
            connect: {email: authorEmail},
          },
        },
          ...infoToInclude({type: "key", key: "data", isSelect: true}, info)
      })};
    },
    publish: async (_, {id, name}, ctx, info) => {
      if (name) fs.writeFileSync(`${name}.json`, JSON.stringify(info));
      if (!(await ctx.prisma.post.findOne({where: {id}}))) return {
        __typename: "Error",
        message: "Post Not Found",
      };
      return ctx.prisma.post.update({
        where: {id: Number(id)},
        data: {published: true},
        ...infoToInclude({type: "union", rootInclude: true, key: 'Post'}, info),
      });
    },
  },
};

export const schema = fs.readFileSync("tests/schema.graphql", "utf-8");
