# GraphQL-Prisma-Info-Include
From your resolver's info argument to prisma include

## Install

```sh
npm install graphql-prisma-info-include
```

## Usage

### Requirements

You need to have a GraphQL server and a prisma client (v2 / `@prisma/client` / `@prisma/cli`)

In your resolver, the fourth argument usually called `info` has the information about what
 you are supposed to return. 

### Example

```ts
import {infoToInclude} from "graphql-prisma-info-include";
// or const {infoToInclude} = require('graphql-prisma-info-include');

const resolvers = {
  Mutation: {
    createUser(_root, { name, email }, ctx, info) {
      return ctx.prisma.user.create({
        data: {name, email},
        ...infoToInclude({type: 'root', rootInclude: true}, info)
      })
    }
  }
}
```

### API

#### `infoToInclude(params: InfoIncludeParams, info: GraphQLResolveInfo)`

`info` parameter is the fourth argument given by GraphQL resolvers. It can accept the following fields:

```ts
interface InfoIncludeParams {
  key?: string | string[]
  type: 'root' | 'union' | 'key'
  rootInclude?: boolean,
  isSelect?: boolean,
}
```

| Key  | Type | Default | Notes |
| ---- | ---- | ------- | ----- |
| key | String | null | the key to get the data when type is not `root` |
| rootInclude | Boolean | true | **on false be careful** if empty can cause prisma error |
| isSelect | Boolean | false | on true will select only fields required on false will select all data of the required types|
| type | String | None | Used to know which data type is return is returned see below |

##### root

Example:
```graphql
# The definition
type Mutation {
    createUser(name: String) : User
}

# The call
mutation {
    createUser(name: "Joe") {name id}
}
```

```ts
import {infoToInclude} from "graphql-prisma-info-include";

const resolvers = {
  Mutation: {
    createUser(_root, {name}, ctx, info) {
      return ctx.prisma.user.create({data: {name}, ...infoToInclude({type: 'root', rootInclude: true}, info)});
    }
  }
}
```

##### key

Example:
```graphql
# The definition
type Mutation {
    createUser(name: String) : User
}

type UserError {
    data: User
    errors: [Error]
}

# The call
mutation {
    createUser(name: "Joe") {data {name id}}
}
```

```ts
import {infoToInclude} from "graphql-prisma-info-include";

const resolvers = {
  Mutation: {
    createUser: async (_root, {name}, ctx, info) => {
      return {data: await ctx.prisma.user.create({
        data: {name},
        ...infoToInclude({type: "key", key: 'data', rootInclude: true}, info)})
      };
    }
  }
}
```

##### union

Example:
```graphql
# The definition
union UserReturn = User | Error

type Mutation {
    createUser(name: String) : UserReturn
}


# The call
mutation {
    createUser(name: "Joe") {...on User {name id}}
}
```

```ts
import {infoToInclude} from "graphql-prisma-info-include";

const resolvers = {
  Mutation: {
    createUser(_root, {name}, ctx, info) {
      return ctx.prisma.user.create({
        data: {name},
        ...infoToInclude({type: "union", key: 'User', rootInclude: true}, info)
      });
    }
  }
}
```
