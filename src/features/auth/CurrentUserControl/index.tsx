import DiscordLoginButton from "../DiscordLoginButton";
import useCurrentUser from "../hook/useCurrentUser";

import Avatar from "@/shared/ui/Avatar";

const CurrentUserControl = () => {
  const { user } = useCurrentUser();

  if (!user) {
    return <DiscordLoginButton />;
  }

  return <Avatar avatarURL={user.icon_url} />;
};

export default CurrentUserControl;
