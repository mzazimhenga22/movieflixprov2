import { Stream } from '../providers/streams';
import { IndividualEmbedRunnerOptions } from '../runners/individualRunner';
import { ProviderRunnerOptions } from '../runners/runner';
export declare function isValidStream(stream: Stream | undefined): boolean;
export declare function validatePlayableStream(stream: Stream, ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions, sourcererId: string): Promise<Stream | null>;
export declare function validatePlayableStreams(streams: Stream[], ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions, sourcererId: string): Promise<Stream[]>;
