import {Tester} from "./tester";
import {describe, it} from "mocha";
import * as chai from "chai";
import {createContext} from "./context";
import {resolvers, schema} from "./schema";
import gql from "graphql-tag";

const tester = new Tester({
  schema,
  resolvers,
});

const context = createContext();

describe("generate a file", function () {
  it("should generate tests/signupTest.json", async function () {
    const response = await tester.call(
      gql`mutation signUpUser($data: UserCreateInput!, $name: String) {
          signupUser(data: $data, name: $name) {
              email id name posts {content}
          }
      }`, {}, context,
      {
        name: "tests/signupTest",
        data: {
          email: "a@a.a",
          name: "a",
          posts: {create: {content: "hello, i'm new", title: "hello", published: true}},
        },
      });
    console.log(response)
    // clean up to assure next one will be okay
    try {
      await context.prisma.user.delete({where: {email: "a@a.a"}});
      await context.prisma.post.deleteMany({where: {title: "hello"}});
    } catch (e) {
    }
    chai.assert.deepInclude(response.data.signupUser, {
      email: "a@a.a",
      name: "a",
      posts: [{content: "hello, i'm new"}],
    });
  });
  it("should generate tests/publishTest.json", async function () {
    const response = await tester.call(
      gql`mutation publish($id: Int, $name: String) {
          publish(id: $id, name: $name) {
              __typename
              ... on Error {message}
              ... on Post {author {name} content published title}
          }
      }`, {}, context,
      {
        name: "tests/publishTest",
        id: 1,
      });
    // clean up to assure next one will be okay
    try {
      await context.prisma.post.update({where: {id: 1}, data: {published: false}});
    } catch (e) {
    }
    chai.assert.deepInclude(response.data.publish, {
      __typename: "Post",
      author: {name: "Alice"},
      content: "https://www.prisma.io/blog/z11sg6ipb3i1/",
      published: true,
      title: "Watch the talks from Prisma Day 2019",
    });
  });
  it("should generate tests/createPostTest.json", async function () {
    const response = await tester.call(
      gql`mutation createDraft($title: String!, $content: String $authorEmail: String $name: String) {
          createDraft(title: $title, content: $content, authorEmail: $authorEmail, name: $name) {
              data {author {email posts {author {posts {content}}}} content published title}
              errors {message}
          }
      }`, {}, context,
      {
        name: "tests/createPostTest",
        title: "test",
        content: "test",
        authorEmail: "bob@prisma.io",
      });
    // clean up to assure next one will be okay
    try {
      await context.prisma.post.deleteMany({
        where: {
          title: "test",
          content: "test",
          published: false,
        },
      });
    } catch (e) {}
    chai.assert.deepNestedInclude(response.data.createDraft.data, {
      author: {
        email: "bob@prisma.io", posts: [
          {"author": {"posts": [{"content": "https://graphqlweekly.com/"}, {"content": "https://twitter.com/prisma/"}, {"content": "test"}]}},
          {"author": {"posts": [{"content": "https://graphqlweekly.com/"}, {"content": "https://twitter.com/prisma/"}, {"content": "test"}]}},
          {"author": {"posts": [{"content": "https://graphqlweekly.com/"}, {"content": "https://twitter.com/prisma/"}, {"content": "test"}]}},
        ],
      },
      content: "test",
      published: false,
      title: "test",
    });
  });
});
