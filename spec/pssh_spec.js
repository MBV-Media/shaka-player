/**
 * @license
 * Copyright 2015 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.require('shaka.util.Pssh');
goog.require('shaka.util.Uint8ArrayUtils');

describe('Pssh', function() {
  var fromHex = shaka.util.Uint8ArrayUtils.fromHex;

  const WIDEVINE_SYSTEM_ID = 'edef8ba979d64acea3c827dcd51d21ed';
  const PLAYREADY_SYSTEM_ID = '9a04f07998404286ab92e65be0885f95';
  const GENERIC_SYSTEM_ID = '1077efecc0b24d02ace33c1e52e2fb4b';

  const WIDEVINE_PSSH =
      '00000028' +                          // atom size
      '70737368' +                          // atom type='pssh'
      '00000000' +                          // v0, flags=0
      'edef8ba979d64acea3c827dcd51d21ed' +  // system id (Widevine)
      '00000008' +                          // data size
      '0102030405060708';                   // data

  const PLAYREADY_PSSH =
      '00000028' +                          // atom size
      '70737368' +                          // atom type 'pssh'
      '00000000' +                          // v0, flags=0
      '9a04f07998404286ab92e65be0885f95' +  // system id (PlayReady)
      '00000008' +                          // data size
      '0102030405060708';                   // data

  const GENERIC_PSSH =
      '00000044' +                          // atom size
      '70737368' +                          // atom type 'pssh'
      '01000000' +                          // v1, flags=0
      '1077efecc0b24d02ace33c1e52e2fb4b' +  // system id (generic CENC)
      '00000002' +                          // key ID count
      '30313233343536373839303132333435' +  // key ID='0123456789012345'
      '38393031323334354142434445464748' +  // key ID='ABCDEFGHIJKLMNOP'
      '00000000';                           // data size=0

  const ZERO_SIZED_GENERIC_PSSH =
      '00000000' +                          // atom size (whole buffer)
      '70737368' +                          // atom type='pssh'
      '01000000' +                          // v1, flags=0
      '1077efecc0b24d02ace33c1e52e2fb4b' +  // system id (generic CENC)
      '00000002' +                          // key ID count
      '30313233343536373839303132333435' +  // key ID='0123456789012345'
      '38393031323334354142434445464748' +  // key ID='ABCDEFGHIJKLMNOP'
      '00000000';                           // data size=0

  const OTHER_BOX =
      '00000018' +                          // atom size
      '77686174' +                          // atom type 'what'
      'deadbeefdeadbeefdeadbeefdeadbeef';   // garbage box data

  const TRUNCATED_WIDEVINE_PSSH =
      WIDEVINE_PSSH.substr(0, WIDEVINE_PSSH.length - 6);

  const TRUNCATED_PLAYREADY_PSSH =
      PLAYREADY_PSSH.substr(0, PLAYREADY_PSSH.length - 6);

  const TRUNCATED_GENERIC_PSSH =
      GENERIC_PSSH.substr(0, GENERIC_PSSH.length - 6);

  it('parses a Widevine PSSH', function() {
    var pssh = new shaka.util.Pssh(fromHex(WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);
  });

  it('parses a PlayReady PSSH', function() {
    var pssh = new shaka.util.Pssh(fromHex(PLAYREADY_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);
  });

  it('parses a generic CENC PSSH', function() {
    var pssh = new shaka.util.Pssh(fromHex(GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);
  });

  it('extracts nothing from a truncated PSSH', function() {
    var pssh = new shaka.util.Pssh(fromHex(TRUNCATED_WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(0);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(TRUNCATED_PLAYREADY_PSSH));
    expect(pssh.systemIds.length).toBe(0);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(TRUNCATED_GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(0);
    expect(pssh.cencKeyIds.length).toBe(0);
  });

  it('parses concatenated PSSHs in any order', function() {
    var pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + PLAYREADY_PSSH));
    expect(pssh.systemIds.length).toBe(2);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + WIDEVINE_PSSH));
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + GENERIC_PSSH));
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        GENERIC_PSSH + WIDEVINE_PSSH));
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + PLAYREADY_PSSH + GENERIC_PSSH));
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + WIDEVINE_PSSH + GENERIC_PSSH));
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + GENERIC_PSSH + PLAYREADY_PSSH));
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + GENERIC_PSSH + WIDEVINE_PSSH));
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        GENERIC_PSSH + WIDEVINE_PSSH + PLAYREADY_PSSH));
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        GENERIC_PSSH + PLAYREADY_PSSH + WIDEVINE_PSSH));
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[2]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);
  });

  it('ignores non-PSSH boxes and continues parsing', function() {
    var pssh = new shaka.util.Pssh(fromHex(
        OTHER_BOX + WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + OTHER_BOX));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + OTHER_BOX + WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(2);
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);
  });

  it('parses a zero-sized PSSH box', function() {
    var pssh = new shaka.util.Pssh(fromHex(ZERO_SIZED_GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + ZERO_SIZED_GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(2);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);
    expect(pssh.systemIds[1]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);
  });

  it('retains data from complete boxes when one is truncated', function() {
    var pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + TRUNCATED_PLAYREADY_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);

    pssh = new shaka.util.Pssh(fromHex(
        WIDEVINE_PSSH + TRUNCATED_GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(WIDEVINE_SYSTEM_ID);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + TRUNCATED_WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(
        PLAYREADY_PSSH + TRUNCATED_GENERIC_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(PLAYREADY_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(0);

    pssh = new shaka.util.Pssh(fromHex(
        GENERIC_PSSH + TRUNCATED_WIDEVINE_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);

    pssh = new shaka.util.Pssh(fromHex(
        GENERIC_PSSH + TRUNCATED_PLAYREADY_PSSH));
    expect(pssh.systemIds.length).toBe(1);
    expect(pssh.systemIds[0]).toBe(GENERIC_SYSTEM_ID);
    expect(pssh.cencKeyIds.length).toBe(2);
  });
});

