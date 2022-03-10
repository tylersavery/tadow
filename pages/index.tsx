import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import styled from "styled-components";
import { Player } from "../src/components/Player";

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
