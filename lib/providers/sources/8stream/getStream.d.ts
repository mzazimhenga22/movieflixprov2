import { MovieScrapeContext, ShowScrapeContext } from '../../../utils/context';
export default function getStream(ctx: ShowScrapeContext | MovieScrapeContext, file: string, key: string): Promise<any>;
