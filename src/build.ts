import {SelectionNode} from "graphql";
import {Params} from ".";

export interface selection {
  select: {
    [key: string]: selection | true
  }
}

export interface include {
  include: {
    [key: string]: include | true
  }
}

export interface withoutMain {
  [key: string]: include | selection
}

export function isEmpty(obj): boolean {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export type includeReturn = selection | include | withoutMain | {}

export function fillSelect(selection: SelectionNode, params: Params): includeReturn {
  const obj = params.isSelect ? {select: {}} : {include: {}};
  if (!("selectionSet" in selection)) return obj;
  selection.selectionSet.selections.forEach((a) => {
    if (params.isSelect) {
      if ("selectionSet" in a && "name" in a && a.selectionSet) obj.select[a.name.value] = fillSelect(a, params);
      else if ("name" in a && (("selectionSet" in a && !a.selectionSet) || !("selectionSet" in a))) obj.select[a.name.value] = true;
    } else if ("selectionSet" in a && "name" in a && a.selectionSet) {
      const val = fillSelect(a, params);
      obj.include[a.name.value] = "include" in val ? val : true;
    }
  });
  if (isEmpty(obj.select || obj.include)) return {};
  return obj;
}
