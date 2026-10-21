"""Reproduce the exact-source and analytic reference fixture checks.
Usage: python3 tests/verification-art-cones-sources.py SOURCE_CACHE_DIRECTORY
Uses only Python's standard library. No downloads or repository mutations.
"""
import csv, hashlib, json, math, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[1]
cache = pathlib.Path(sys.argv[1])
fixture = json.loads((root / 'tests/fixtures/art-cones-source-references.json').read_text())

def read_table(name, expected, metadata_sha):
    raw = (cache / name).read_bytes()
    metadata_bytes = (cache / (name + '_metadata.json')).read_bytes()
    assert hashlib.sha256(metadata_bytes).hexdigest() == metadata_sha
    meta = json.loads(metadata_bytes)
    assert hashlib.sha256(raw).hexdigest() == expected
    for checksum in meta['checksums']:
        assert hashlib.new(checksum['hashMethod'], raw).hexdigest() == checksum['checksum']
    rows = [[float(x) for x in r] for r in csv.reader(raw.decode().splitlines())]
    validation = meta['datatableInfo']['validations']
    sums = json.loads(next(v['validationValue'] for v in validation if v['validationType'] == 'sumOfColumns'))
    for col, expected_sum in enumerate(sums):
        actual = math.fsum(r[col] for r in rows if math.isfinite(r[col]))
        assert math.isclose(actual, expected_sum, rel_tol=3e-14, abs_tol=3e-14)
    sample = next(v for v in validation if v['validationType'] == 'sampleRow')
    assert rows[int(sample['validationParameter'])-1] == [float(x) for x in sample['validationValue'].split(',')]
    return rows

rows = read_table('CIE_lms_cf_2deg.csv', fixture['source_csv_sha256'], 'c488310e9f076a9e00bff69d206eae8821bd17137e6a3ba260570eae4ff91fab')
info=json.loads((cache/'CIE_lms_cf_2deg.csv_metadata.json').read_bytes())['datatableInfo']
assert info['interpolationMethod']=='linear' and info['extrapolationMethod']=='zero'
assert info['dataQuality']=='approximated'
assert [h['wavelength_last'] for h in info['columnHeaders']]==[830,830,830,615]
xyz = read_table('CIE_cfb_stv_2deg.csv', fixture['xyz_csv_sha256'], '24eb42e00e0b6dc3f6b60fcaae1bd5ea2d9195e6da28ff69b801cf475c80cb7a')
assert len(rows) == 89 and len(xyz) == 441
assert [r for r in xyz if r[0] % 5 == 0] == fixture['xyz5nm']
assert sum(math.isnan(r[3]) for r in rows) == 43

def erf_difference(a, b):
    if a >= 0: return math.erfc(a) - math.erfc(b)
    if b <= 0: return math.erfc(-b) - math.erfc(-a)
    return math.erf(b) - math.erf(a)

def gaussian_integrals(center, fwhm):
    # On each source segment c(lambda)=slope*(lambda-center)+at_center.
    # Integrate c(lambda)*exp(-k*(lambda-center)^2) using the two exact
    # primitives: sqrt(pi)/(2sqrt(k))*erf and -exp(-k*x*x)/(2k).
    # erfc differences avoid subtracting two nearly-unit erf values.
    k = 4 * math.log(2) / fwhm**2
    result = []
    for cone in range(1, 4):
        terms = []
        for left, right in zip(rows, rows[1:]):
            if not all(math.isfinite(r[cone]) for r in [left, right]): continue
            slope = (right[cone] - left[cone]) / 5
            at_center = left[cone] + slope*(center-left[0])
            u, v = math.sqrt(k)*(left[0]-center), math.sqrt(k)*(right[0]-center)
            terms.append(at_center*math.sqrt(math.pi)/(2*math.sqrt(k))*erf_difference(u,v)
                         + slope/(2*k)*(math.exp(-u*u)-math.exp(-v*v)))
        result.append(sum(terms))
    return result

for case in fixture['gaussianIntegral']:
    actual = gaussian_integrals(case['center'], case['fwhm'])
    assert all(math.isclose(a,b,rel_tol=2e-15,abs_tol=1e-155) for a,b in zip(actual,case['expected'])), (case, actual)
print('PASS original CSV checksums, both metadata sum/sample validations, all89 LMS and441 XYZ source rows; all89 coincident XYZ fixture rows and11 independent analytic Gaussian reference triples')
