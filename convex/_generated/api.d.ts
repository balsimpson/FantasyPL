/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as articleEdits from "../articleEdits.js";
import type * as articleJobValidators from "../articleJobValidators.js";
import type * as articleJobs from "../articleJobs.js";
import type * as articleProvider from "../articleProvider.js";
import type * as articleResearch from "../articleResearch.js";
import type * as articleResearchIdeas from "../articleResearchIdeas.js";
import type * as articleResearchValidators from "../articleResearchValidators.js";
import type * as articleValidators from "../articleValidators.js";
import type * as articles from "../articles.js";
import type * as managerShares from "../managerShares.js";
import type * as schedulerHistory from "../schedulerHistory.js";
import type * as schedulerValidators from "../schedulerValidators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  articleEdits: typeof articleEdits;
  articleJobValidators: typeof articleJobValidators;
  articleJobs: typeof articleJobs;
  articleProvider: typeof articleProvider;
  articleResearch: typeof articleResearch;
  articleResearchIdeas: typeof articleResearchIdeas;
  articleResearchValidators: typeof articleResearchValidators;
  articleValidators: typeof articleValidators;
  articles: typeof articles;
  managerShares: typeof managerShares;
  schedulerHistory: typeof schedulerHistory;
  schedulerValidators: typeof schedulerValidators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
