type RecordSearchParams = { [key: string]: string | string[] | undefined };
export type Params = Promise<{ slug: string }>;
export type SearchParams = Promise<RecordSearchParams>;
