import WsResponse from "./WSResponse";

export default interface TournamentPlayer extends WsResponse {
  user_id: number;
  discord_username: string;
}
