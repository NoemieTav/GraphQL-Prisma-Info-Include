import {GraphQLResolveInfo} from "graphql";
import {describe, it} from "mocha";
import * as chai from "chai";
import {infoToInclude} from "../src/main";
import * as createPostTest from "./createPostTest.json";
import * as key from "./key.json";
import * as publishTest from "./publishTest.json";
import * as root from "./root.json";
import * as signupTest from "./signupTest.json";
import * as union from "./union.json";

describe("test", function () {
  it("should test createPostTest", function () {
    // the params are the same as in src/schema.ts -> to understand see schema.graphql
    const data = infoToInclude({
      type: "key",
      key: "data",
      rootInclude: true,
    }, createPostTest as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {include: {author: {include: {posts: {include: {author: {include: {posts: true}}}}}}}});
  });
  it("should test key", function () {
    const data = infoToInclude({
      type: "key",
      key: "data",
      rootInclude: true,
      isSelect: true,
    }, key as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {
      select: {friends: {select: {friends: {select: {id: true}}, id: true}}, id: true},
    });
  });
  it("should test publish", function () {
    // the params are the same as in src/schema.ts -> to understand see schema.graphql
    const data = infoToInclude({
      type: "union",
      key: "Post",
      rootInclude: false,
    }, publishTest as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {author: true});
  });
  it("should test root", function () {
    const data = infoToInclude({
      type: "root",
    }, root as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {"include": {"players": {"include": {"friends": true}}}});
  });
  it("should test signup", function () {
    // the params are the same as in src/schema.ts -> to understand see schema.graphql
    const data = infoToInclude({
      type: "root",
      isSelect: false,
      rootInclude: false,
    }, signupTest as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {posts: true});
  });
  it("should test union", function () {
    const data = infoToInclude({
      type: "union",
      key: "Trip",
      isSelect: true,
    }, union as unknown as GraphQLResolveInfo);
    chai.assert.deepEqual(data, {
      "select": {
        "id": true, "steps": {"select": {"id": true}},
        "user": {"select": {"trips": {"select": {"id": true}}}},
      },
    });
  });
});
