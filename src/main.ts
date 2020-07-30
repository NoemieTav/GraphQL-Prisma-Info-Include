import type {InfoIncludeParams} from '.';
import {GraphQLResolveInfo} from "graphql";
import {selectSelection} from "./select";
import {fillSelect, includeReturn} from "./build";

export function infoToInclude(params: InfoIncludeParams, info: GraphQLResolveInfo): includeReturn {
    if (!info) return {}
    const data = selectSelection(info, params);
    if (!data) return {}
    const ret = fillSelect(data, params);
    if (!('select' in ret) && !('include' in ret)) return {};
    if (params.rootInclude === false && 'select' in ret) return ret.select;
    if (params.rootInclude === false && 'include' in ret) return ret.include;
    return ret
}
