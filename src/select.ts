import type {GraphQLResolveInfo, SelectionNode} from 'graphql';
import {InfoIncludeParams} from ".";

export function selectSelection(info: GraphQLResolveInfo, params: InfoIncludeParams): SelectionNode | undefined {
    const root = info.operation.selectionSet.selections[0]
    if (params.type === "root")
        return root;
    if ('selectionSet' in root && root.selectionSet) {
        const ons = root.selectionSet.selections;
        return ons.find((a) => {
            if (params.type === "key") return 'name' in a && (
                (Array.isArray(params.key) && (a.name.value in params.key))
                || a.name.value === params.key)
            if (params.type === "union") return 'typeCondition' in a && (
                (Array.isArray(params.key) && (a.typeCondition.name.value in params.key))
                || a.typeCondition.name.value === params.key)
        });
    }
}
