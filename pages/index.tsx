import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Player } from "../src/components/Player";

const LogRocket = require("logrocket");
const setupLogRocketReact = require("logrocket-react");

const StartContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  button {
    font-size: 32px;
  }
`;

const Home: NextPage = () => {
  const [started, _started] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      LogRocket.init("tb20bh/tadow-4ugrv");
      // plugins should also only be initialized when in the browser
      setupLogRocketReact(LogRocket);
    }
  }, []);

  return (
    <div>
      <Head>
        <title>TADOW</title>
        <meta name="description" content="TADOW" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {started ? (
        <Player />
      ) : (
        <StartContainer>
          <button onClick={() => _started(true)}>Start</button>
        </StartContainer>
      )}
    </div>
  );
};

export default Home;
