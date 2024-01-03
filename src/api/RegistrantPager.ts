import type { RegistrantPage } from "@api/types/RegistrantPage";
import type { Registrant } from "./types/Registrant";
import ApiWorker from "@api/ApiWorker";
import Logger from "@common/Logger";
import { RegistrantPageSchema } from "./schema/RegistrantPageSchema";

/**
 * Wrapper class for interacting with pagination on the /registrants/ endpoint
 */
export default class RegistrantPager {
  public morePages: boolean;
  private pageData: RegistrantPage;
  private readonly logger = Logger(module);

  constructor(data: RegistrantPage) {
    this.pageData = data;
    this.morePages = this.isMorePages();
  }

  /**
   * Advances to the next page of registrants
   * @returns Whether or not the operation succeeded
   */
  public async getNextPage(): Promise<boolean> {
    if (!this.morePages || !this.pageData.next) return false;
    const res = await ApiWorker.safeFetch(this.pageData.next, { method: "GET" });
    const parsed = RegistrantPageSchema.safeParse(res);
    if (!parsed.success) {
      this.logger.warn("Received bad data while advancing pages");
      return false;
    }
    this.pageData = parsed.data;
    this.morePages = this.isMorePages();
    return true;
  }

  /**
   * Getter for `this.pageData.results` i.e. the array of registrants
   */
  public getRegistrants(): Registrant[] {
    return this.pageData.results;
  }

  /**
   * Determines if there are more pages of registrants to pull
   */
  private isMorePages(): boolean {
    return this.pageData.next ? true : false;
  }
}
