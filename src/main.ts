import type {Params} from '.';
import {GraphQLResolveInfo} from "graphql";
import {selectSelection} from "./select";
import {fillSelect, includeReturn} from "./build";

export function infoToInclude(params: Params, info: GraphQLResolveInfo): includeReturn {
    const data = selectSelection(info, params);
    if (!data) return {}
    const ret = fillSelect(data, params);
    if (!params.rootInclude && 'select' in ret) return ret.select;
    if (!params.rootInclude && 'include' in ret) return ret.include;
    return ret
}
