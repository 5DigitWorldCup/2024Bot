import ApiEvent from "@api/interfaces/ApiEvent";
import ApiWorker from "@api/ApiWorker";
import { RegistrantSchema } from "@api/schema/RegistrantSchema";

export default <ApiEvent>{
  name: "message",
  once: false,
  async execute(worker: ApiWorker, ev) {
    const data = JSON.parse(ev) as { message: string };
    const parsed = RegistrantSchema.safeParse(JSON.parse(data.message));

    if (parsed.success) {
      worker.client.autoNameService.updateOneUser(parsed.data);
    } else {
      this.logger.info("what");
    }
  },
};
