const isObject = require("lodash.isobject");
import * as fs from "fs";
import {ASTNode, graphql, GraphQLSchema, print} from "graphql";
import {importSchema} from "graphql-import";
import {applyMiddleware as applyFieldMiddleware, FragmentReplacement} from "graphql-middleware";
import {IMiddleware, IMiddlewareGenerator, IResolvers} from "graphql-middleware/dist/types";
import {
  addMockFunctionsToSchema,
  GraphQLParseOptions,
  IDirectiveResolvers,
  ILogger,
  IMocks,
  IResolverValidationOptions,
  ITypeDefinitions,
  makeExecutableSchema,
  mergeSchemas,
  SchemaDirectiveVisitor,
} from "graphql-tools";
import * as path from "path";

export {IMocks} from "graphql-tools";

function loadSchemas(schema: ITypeDefinitions) {
  if (typeof schema === "function") schema = schema();
  if (typeof schema === "string") {
    if (schema.endsWith("graphql") || schema.endsWith("gql")) {
      const schemaPath = path.resolve(schema);
      if (!fs.existsSync(schemaPath)) throw new Error(`No schema found for path: ${schemaPath}`);
      return importSchema(schemaPath);
    } else return schema;
  }
  if ("kind" in schema && schema.kind === "Document") return print(<ASTNode>schema);
  if (Array.isArray(schema)) return mergeSchemas({schemas: schema.map(loadSchemas)});
  throw new Error("Cannot load schema: " + schema);
}

interface Props {
  schema: ITypeDefinitions,
  resolvers?: IResolvers<any, any> | Array<IResolvers<any, any>>,
  middlewares?: (IMiddleware<any, any, any> | IMiddlewareGenerator<any, any, any>)[]
  logger?: ILogger,
  allowUndefinedInResolve?: boolean,
  resolverValidationOptions?: IResolverValidationOptions,
  directiveResolvers?: IDirectiveResolvers<any, any>,
  schemaDirectives?: { [name: string]: typeof SchemaDirectiveVisitor },
  parseOptions?: GraphQLParseOptions,
  inheritResolversFromInterfaces?: boolean,
  mocks?: IMocks,
}

export class Tester {
  schema: GraphQLSchema;
  middlewareFragmentReplacements: FragmentReplacement[];

  constructor(
    {
      schema, resolvers, middlewares, logger, allowUndefinedInResolve,
      resolverValidationOptions, directiveResolvers, schemaDirectives, parseOptions,
      inheritResolversFromInterfaces, mocks,
    }: Props) {
    if (!schema) throw new Error("The schema is require");
    let buildedSchema: any = schema;
    if (resolvers) buildedSchema = makeExecutableSchema({
      typeDefs: loadSchemas(schema),
      resolvers,
      logger,
      allowUndefinedInResolve,
      resolverValidationOptions,
      directiveResolvers,
      schemaDirectives,
      parseOptions,
      inheritResolversFromInterfaces,
    });
    this.schema = buildedSchema;
    if (middlewares) {
      const {schema, fragmentReplacements} = applyFieldMiddleware(this.schema, ...middlewares);
      this.schema = schema;
      this.middlewareFragmentReplacements = fragmentReplacements;
    }
    if (mocks) {
      addMockFunctionsToSchema({
        schema: this.schema,
        mocks: typeof mocks === "object" ? mocks : undefined,
        preserveResolvers: false,
      });
    }
  }

  call(query, rootValue, contextValue, variableValues) {
    if (isObject(query)) query = print(query);
    return graphql(this.schema, query, rootValue, contextValue, variableValues);
  }
}
