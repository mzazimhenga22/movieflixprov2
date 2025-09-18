import { MovieScrapeContext, ShowScrapeContext } from '../../../utils/context';
export default function getStream(ctx: ShowScrapeContext | MovieScrapeContext, id: string): Promise<any>;
